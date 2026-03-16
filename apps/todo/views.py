from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import filters
from django.utils import timezone
from datetime import timedelta
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'priority']
    ordering = ['-created_at']

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

    @action(detail=False, methods=['get'])
    def activity(self, request):
        user_todos = self.get_queryset()
        
        # Determine the period from the query params
        period = request.query_params.get('period', '7d')
        
        today = timezone.now().date()
        daily_data = []

        if period == '1y':
            # Group by month for 1 year
            for i in range(11, -1, -1):
                # Approximation of "i months ago"
                month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
                # Filter for items in that month (ignoring strict edge days logic for simplicity in SQLite compatible way)
                month_total = user_todos.filter(created_at__year=month_start.year, created_at__month=month_start.month).count()
                month_completed = user_todos.filter(created_at__year=month_start.year, created_at__month=month_start.month, is_completed=True).count()
                
                daily_data.append({
                    'date': month_start.strftime('%b %Y'),
                    'total': month_total,
                    'completed': month_completed
                })
        else:
            # Handle days logic for 3d, 7d, 30d
            days = 7
            if period == '3d': days = 3
            elif period == '30d': days = 30
            
            for i in range(days - 1, -1, -1):
                date_to_check = today - timedelta(days=i)
                day_total = user_todos.filter(created_at__date=date_to_check).count()
                day_completed = user_todos.filter(created_at__date=date_to_check, is_completed=True).count()
                
                daily_data.append({
                    'date': date_to_check.strftime('%b %d'),
                    'total': day_total,
                    'completed': day_completed
                })

        return Response(daily_data)