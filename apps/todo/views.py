from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from apps.todo.models import Todo, Category
from apps.todo.serializers import TodoSerializer, CategorySerializer

@extend_schema(tags=["Categories"])
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_queryset(self):
        return self.request.user.categories.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

@extend_schema(tags=["Todos"])
class TodoViewSet(ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer

    def get_queryset(self):
        return self.request.user.todos.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        user_todos = self.get_queryset()
        now = timezone.now()

        total = user_todos.count()
        completed = user_todos.filter(is_completed=True).count()
        pending = user_todos.filter(is_completed=False).count()
        overdue = user_todos.filter(is_completed=False, deadline__lt=now).count()

        return Response({
            'total_tasks': total,
            'completed_tasks': completed,
            'pending_tasks': pending,
            'overdue_tasks': overdue
        })