from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView
from config.spectacular_view import CustomSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.todo.urls')),
    path('api/', include('apps.users.urls')),

    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("", CustomSwaggerView.as_view(), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(), name="redoc"),
]
