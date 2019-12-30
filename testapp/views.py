from django.shortcuts import render

def on_message(data):
    print('I received a message!')

def home(request):
    return render(request, 'index.html')
