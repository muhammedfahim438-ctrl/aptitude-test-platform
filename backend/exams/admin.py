from django.contrib import admin
from .models import AnswerKey, StudentSubmission

@admin.register(AnswerKey)
class AnswerKeyAdmin(admin.ModelAdmin):
    list_display = ['date', 'created_at', 'updated_at']
    ordering = ['-date']

@admin.register(StudentSubmission)
class StudentSubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam_date', 'submitted_at']
    ordering = ['-exam_date']