import os
from datetime import date
from io import BytesIO

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import TestCase

from exams.models import Question


class ImageUploadTest(TestCase):
    def _make_image(self, name='test.jpg', content_type='image/jpeg', size=1024):
        file_bytes = BytesIO(b'\xff\xd8' + b'\x00' * (size - 2))
        return InMemoryUploadedFile(
            file=file_bytes,
            field_name='image',
            name=name,
            content_type=content_type,
            size=size,
            charset=None,
        )

    def test_valid_image_upload(self):
        question = Question.objects.create(
            exam_date=date(2026, 7, 18),
            text='What is shown in this image?',
            option_a='A', option_b='B', option_c='C', option_d='D',
            image=self._make_image(),
        )
        self.assertIsNotNone(question.image)

    def test_image_file_saved_on_disk(self):
        question = Question.objects.create(
            exam_date=date(2026, 7, 18),
            text='Image question',
            option_a='A', option_b='B', option_c='C', option_d='D',
            image=self._make_image(),
        )
        question.refresh_from_db()
        self.assertTrue(os.path.exists(question.image.path))

    def test_question_without_image_saves(self):
        question = Question.objects.create(
            exam_date=date(2026, 7, 18),
            text='No image question',
            option_a='A', option_b='B', option_c='C', option_d='D',
            image=None,
        )
        self.assertFalse(question.image)

    def test_image_url_and_image_independent(self):
        question = Question.objects.create(
            exam_date=date(2026, 7, 18),
            text='Both image fields',
            option_a='A', option_b='B', option_c='C', option_d='D',
            image_url='https://example.com/image.png',
            image=self._make_image(),
        )
        self.assertEqual(question.image_url, 'https://example.com/image.png')
        self.assertTrue(question.image)

