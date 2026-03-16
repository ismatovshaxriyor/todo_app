from rest_framework import serializers
from apps.todo.models import Todo

class TodoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Todo
        fields = ('id', 'title', 'user', 'description', 'is_completed', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at', 'user')

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long")
        return value