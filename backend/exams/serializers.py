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


class StudentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubmission
        fields = ['exam_date', 'answers']
