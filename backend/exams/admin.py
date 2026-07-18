from django.contrib import admin
from .models import Question, AnswerKey, StudentSubmission


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'exam_date', 'text', 'retake_allowed', 'created_at')
    list_filter = ('exam_date', 'retake_allowed')
    search_fields = ('text',)


@admin.register(AnswerKey)
class AnswerKeyAdmin(admin.ModelAdmin):
    list_display = ('date', 'created_at', 'updated_at')


@admin.register(StudentSubmission)
class StudentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam_date', 'submitted_at')
    list_filter = ('exam_date',)