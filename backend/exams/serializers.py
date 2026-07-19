from rest_framework import serializers
from .models import Question, StudentSubmission


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'image_url']


class AdminQuestionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'exam_date', 'text',
            'option_a', 'option_b', 'option_c', 'option_d',
            'image_url', 'retake_allowed', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_image_url(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            try:
                return obj.image.url
            except ValueError:
                return None
        return None


class AdminQuestionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'text', 'option_a', 'option_b', 'option_c', 'option_d',
            'image_url', 'retake_allowed',
        ]


class StudentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubmission
        fields = ['exam_date', 'answers']
