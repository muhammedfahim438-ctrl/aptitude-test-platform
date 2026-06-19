from django.apps import AppConfig


class PipelineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pipeline'

    def ready(self):
        # Day-3 (US-F03): signals.py registers the pre_save stale-CSV-purge
        # receiver. Importing it here ensures the signal connects when
        # Django starts up.
        import pipeline.signals  # noqa: F401
