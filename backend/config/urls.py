from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/classrooms/', include('apps.classrooms.urls')),
]
