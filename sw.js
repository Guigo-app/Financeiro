// Arquivo: public/sw.js

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'App Guigo', body: 'Nova atualização!' };
  
  const options = {
    body: data.body,
    icon: '/Financeiro/favicon.svg',
    badge: '/Financeiro/favicon.svg'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/Financeiro/')
  );
});