import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from config.logging_setup import setup_logging
setup_logging()

from django.core.asgi import get_asgi_application
application = get_asgi_application()
