from django.apps import AppConfig


class PipelineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pipeline'

    def ready(self):
        import pipeline.signals  # noqa: F401