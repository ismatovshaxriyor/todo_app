from rest_framework import serializers
from django.utils import timezone
from apps.todo.models import Todo, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'title', 'user', 'created_at')
        read_only_fields = ('created_at', 'user')

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ('id', 'title', 'user', 'category', 'description', 'is_completed', 'deadline', 'priority', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at', 'user')

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long")
        return value

    def validate_deadline(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Deadline cannot be in the past")
        return value