from rest_framework.viewsets import ModelViewSet
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