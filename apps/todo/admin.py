from django.contrib import admin
from apps.todo.models import Todo

# Register your models here.
admin.site.register([Todo])