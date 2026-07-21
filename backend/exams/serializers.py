# exams/serializers.py
# TODO: Owner = SREEKUTTAN / FAHIM
#
# DRF serializers for Question, AnswerKey, StudentSubmission as needed
# by views.py and any admin-facing endpoints.

from rest_framework import serializers
from .models import Question, StudentSubmission


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'image_url']


class AdminQuestionSerializer(serializers.ModelSerializer):
    """
    Admin-facing question serializer — includes exam_date, retake_allowed,
    and created_at, which the student-facing QuestionSerializer deliberately
    omits. Used by GET /api/admin/questions/ and /api/admin/questions/<id>/.
    """
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'exam_date', 'text',
            'option_a', 'option_b', 'option_c', 'option_d',
            'image_url', 'retake_allowed', 'created_at',
        ]

    def get_image_url(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            try:
                return obj.image.url
            except ValueError:
                return None
        return None


class StudentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubmission
        fields = ['exam_date', 'answers']