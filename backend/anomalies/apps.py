from django.apps import AppConfig


class AnomaliesConfig(AppConfig):
    name = 'anomalies'

    def ready(self):
        import anomalies.signals  # noqa: F401
