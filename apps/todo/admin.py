from django.contrib import admin
from apps.todo.models import Todo, Category

# Register your models here.
admin.site.register([Todo, Category])