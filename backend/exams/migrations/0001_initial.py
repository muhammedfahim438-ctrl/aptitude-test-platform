import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AnswerKey',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(unique=True)),
                ('correct_answers', models.JSONField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-date']},
        ),
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('exam_date', models.DateField()),
                ('text', models.TextField()),
                ('option_a', models.CharField(max_length=500)),
                ('option_b', models.CharField(max_length=500)),
                ('option_c', models.CharField(max_length=500)),
                ('option_d', models.CharField(max_length=500)),
                ('image_url', models.URLField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['exam_date', 'id'],
                'indexes': [models.Index(fields=['exam_date'], name='exams_quest_exam_da_7ff7b5_idx')],
            },
        ),
        migrations.CreateModel(
            name='StudentSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('exam_date', models.DateField()),
                ('answers', models.JSONField()),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-exam_date'],
                'indexes': [models.Index(fields=['exam_date'], name='exams_stude_exam_da_54a78b_idx')],
            },
        ),
        migrations.AddConstraint(
            model_name='studentsubmission',
            constraint=models.UniqueConstraint(fields=('student', 'exam_date'), name='unique_student_exam_date_submission'),
        ),
    ]