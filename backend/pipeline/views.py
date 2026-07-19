import os
import logging
from datetime import date, timedelta, time

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.http import FileResponse, HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from core.permissions import IsTeacherUser, IsStudentUser
from exams.models import AnswerKey, Question, StudentSubmission
from .models import ScheduledFileDeletion, ReportDownloadLog, WeeklyLeaderboard, MonthlyLeaderboard, DailyScore, DailyLeaderboard

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacherUser])
def admin_download_report(request, exam_date):
    filepath = os.path.join(
        settings.MEDIA_ROOT, 'exports', f'Master_Report_{exam_date}.csv'
    )
    if not os.path.exists(filepath):
        return HttpResponse("Report not yet generated.", status=404)

    delete_at = timezone.now() + timedelta(hours=4)

    ReportDownloadLog.objects.create(
        file_path=filepath,
        downloaded_at=timezone.now(),
        scheduled_deletion_at=delete_at,
    )
    ScheduledFileDeletion.objects.create(
        file_path=filepath,
        delete_after=delete_at,
    )
    logger.info(f"[SCHEDULE] CSV deletion scheduled at {delete_at}: {filepath}")

    file_handle = open(filepath, 'rb')
    return FileResponse(
        file_handle,
        as_attachment=True,
        filename=f'Master_Report_{exam_date}.csv'
    )


@csrf_exempt
def process_scheduled_deletions(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    due_records = ScheduledFileDeletion.objects.filter(
        delete_after__lte=timezone.now(),
        deleted=False,
    )
    deleted_count = 0
    for record in due_records:
        try:
            os.remove(record.file_path)
            logger.info(f"[CRON] CSV deleted: {record.file_path}")
        except FileNotFoundError:
            logger.warning(f"[CRON] File already gone: {record.file_path}")
        record.deleted = True
        record.save(update_fields=['deleted'])
        deleted_count += 1

    return JsonResponse({'status': 'processed', 'deleted': deleted_count})


@csrf_exempt
def flush_weekly_leaderboard_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    deleted_count, _ = WeeklyLeaderboard.objects.all().delete()
    return JsonResponse({'status': 'flushed', 'deleted': deleted_count})


@csrf_exempt
def compute_weekly_leaderboard_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    call_command('compute_weekly_leaderboard')
    return JsonResponse({'status': 'computed'})


@csrf_exempt
def compute_monthly_leaderboard_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    call_command('compute_monthly_leaderboard')
    return JsonResponse({'status': 'computed'})


@csrf_exempt
def flush_monthly_leaderboard_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    deleted_count, _ = MonthlyLeaderboard.objects.all().delete()
    return JsonResponse({'status': 'flushed', 'deleted': deleted_count})


@csrf_exempt
def aggregate_scores_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    target_date = request.POST.get('date')
    if target_date:
        call_command('aggregate_scores', date=target_date)
    else:
        call_command('aggregate_scores')

    return JsonResponse({'status': 'aggregated', 'date': target_date or 'yesterday'})


@csrf_exempt
def cleanup_day_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    target_date = request.POST.get('date')
    if target_date:
        call_command('cleanup_day', date=target_date)
    else:
        call_command('cleanup_day')

    return JsonResponse({'status': 'cleaned', 'date': target_date or 'yesterday'})


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUser]

    def get(self, request):
        today = date.today()

        total_students = User.objects.filter(
            is_student=True, is_active=True
        ).count()

        tests_completed = StudentSubmission.objects.filter(
            exam_date=today
        ).count()

        questions_live = Question.objects.filter(
            exam_date=today
        ).count()

        return Response({
            'date': today.isoformat(),
            'total_students': total_students,
            'tests_completed': tests_completed,
            'questions_live': questions_live,
        })


class AdminRankingsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUser]

    def get(self, request):
        try:
            top = int(request.query_params.get('top', 10))
        except ValueError:
            return Response({'error': 'top must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

        period = request.query_params.get('period', 'weekly')

        if period == 'daily':
            latest_date = (
                DailyScore.objects.order_by('-exam_date')
                .values_list('exam_date', flat=True)
                .first()
            )
            if not latest_date:
                return Response([], status=status.HTTP_200_OK)

            rows = (
                DailyScore.objects.filter(exam_date=latest_date)
                .select_related('student')
                .order_by('-score')[:top]
            )
            data = [
                {
                    'rank': idx + 1,
                    'name': row.student.full_name,
                    'roll_number': row.student.roll_number,
                    'score': row.score,
                    'exam_date': row.exam_date.isoformat(),
                }
                for idx, row in enumerate(rows)
            ]

        elif period == 'weekly':
            latest_week = (
                WeeklyLeaderboard.objects.order_by('-week_start')
                .values_list('week_start', flat=True)
                .first()
            )
            if not latest_week:
                return Response([], status=status.HTTP_200_OK)

            rows = (
                WeeklyLeaderboard.objects.filter(week_start=latest_week)
                .select_related('student')
                .order_by('rank')[:top]
            )
            data = [
                {
                    'rank': row.rank,
                    'name': row.student.full_name,
                    'roll_number': row.student.roll_number,
                    'score': row.total_score,
                    'exam_date': row.week_start.isoformat(),
                }
                for row in rows
            ]

        else:
            return Response(
                {'error': 'period must be "daily" or "weekly".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(data, status=status.HTTP_200_OK)


class AdminReportsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherUser]

    def get(self, request):
        today = date.today()
        range_param = request.query_params.get('range')
        from_str = request.query_params.get('from')
        to_str = request.query_params.get('to')

        if range_param == 'weekly':
            start_date, end_date = today - timedelta(days=7), today
        elif range_param == 'monthly':
            start_date, end_date = today - timedelta(days=30), today
        elif from_str and to_str:
            try:
                start_date = date.fromisoformat(from_str)
                end_date = date.fromisoformat(to_str)
            except ValueError:
                return Response(
                    {'error': 'from/to must be valid YYYY-MM-DD dates.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            start_date, end_date = today, today

        if start_date > end_date:
            return Response(
                {'error': 'from date must not be after to date.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_students = User.objects.filter(is_student=True, is_active=True).count()

        submissions = StudentSubmission.objects.filter(
            exam_date__gte=start_date, exam_date__lte=end_date
        )
        attended_student_ids = set(submissions.values_list('student_id', flat=True))
        total_attended = len(attended_student_ids)
        total_absent = max(total_students - total_attended, 0)

        scores = (
            DailyScore.objects.filter(exam_date__gte=start_date, exam_date__lte=end_date)
            .select_related('student')
            .order_by('-exam_date', '-score')
        )
        student_performance = [
            {
                'student_id': s.student_id,
                'name': s.student.full_name,
                'roll_number': s.student.roll_number,
                'score': s.score,
                'exam_date': s.exam_date.isoformat(),
            }
            for s in scores
        ]

        return Response({
            'from': start_date.isoformat(),
            'to': end_date.isoformat(),
            'total_students': total_students,
            'total_attended': total_attended,
            'total_absent': total_absent,
            'student_performance': student_performance,
        }, status=status.HTTP_200_OK)


class StudentLeaderboardView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUser]

    def get(self, request):
        top = int(request.query_params.get('top', 25))

        latest_date = (
            DailyScore.objects.order_by('-exam_date')
            .values_list('exam_date', flat=True)
            .first()
        )
        if not latest_date:
            return Response({
                'rankings': [],
                'total_examinees': 0,
                'latest_date': None,
            }, status=status.HTTP_200_OK)

        total_examinees = DailyScore.objects.filter(
            exam_date=latest_date
        ).count()

        rows = (
            DailyScore.objects.filter(exam_date=latest_date)
            .select_related('student')
            .order_by('-score')[:top]
        )
        data = [
            {
                'rank': idx + 1,
                'name': row.student.full_name,
                'roll_number': row.student.roll_number or '',
                'score': row.score,
            }
            for idx, row in enumerate(rows)
        ]

        return Response({
            'rankings': data,
            'total_examinees': total_examinees,
            'latest_date': latest_date.isoformat(),
        }, status=status.HTTP_200_OK)


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUser]

    def get(self, request):
        today = timezone.now().date()
        now_time = timezone.now().time()

        if now_time < time(10, 0):
            today_status = 'before_window'
        elif now_time <= time(14, 0):
            has_submission = StudentSubmission.objects.filter(
                student=request.user, exam_date=today
            ).exists()
            today_status = 'submitted' if has_submission else 'in_progress'
        else:
            has_submission = StudentSubmission.objects.filter(
                student=request.user, exam_date=today
            ).exists()
            if not has_submission:
                today_status = 'missed'
            else:
                has_score = DailyScore.objects.filter(
                    student=request.user, exam_date=today
                ).exists()
                today_status = 'reviewed' if has_score else 'submitted'

        today_score = None
        total_questions = 20
        submitted_at = None

        ds = DailyScore.objects.filter(
            student=request.user, exam_date=today
        ).first()
        if ds:
            today_score = ds.score
            sub = StudentSubmission.objects.filter(
                student=request.user, exam_date=today
            ).values_list('submitted_at', first=True)
            if sub:
                submitted_at = sub.isoformat()
            ak = AnswerKey.objects.filter(date=today).first()
            if ak and ak.correct_answers:
                total_questions = len(ak.correct_answers)

        seven_days_ago = today - timedelta(days=7)
        recent_scores = []
        recent_ds = DailyScore.objects.filter(
            student=request.user,
            exam_date__gte=seven_days_ago,
            exam_date__lte=today,
        ).order_by('-exam_date')

        for score in recent_ds:
            ak = AnswerKey.objects.filter(date=score.exam_date).first()
            total = len(ak.correct_answers) if ak and ak.correct_answers else 20
            recent_scores.append({
                'date': score.exam_date.isoformat(),
                'score': score.score,
                'total_questions': total,
            })

        total_exams_taken = DailyScore.objects.filter(
            student=request.user
        ).count()
        all_scores = DailyScore.objects.filter(
            student=request.user
        ).values_list('score', flat=True)
        avg = sum(all_scores) / len(all_scores) if all_scores else None

        return Response({
            'today_status': today_status,
            'today': {
                'score': today_score,
                'total_questions': total_questions,
                'submitted_at': submitted_at,
            },
            'recent_scores': recent_scores,
            'total_exams_taken': total_exams_taken,
            'average_score': round(avg, 1) if avg else None,
        })
