from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema
from apps.todo.models import Todo
from apps.todo.serializers import TodoSerializer

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