self.addEventListener('push', event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: 'VYOMA',
      body: 'You have a new festival reminder.'
    };
  }

  const title = data.title || 'VYOMA';
  const options = {
    body: data.body || 'A festival reminder is available.',
    icon: '/icon-192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  );

  if (url.origin !== self.location.origin) {
    return;
  }

  event.waitUntil(
    clients.openWindow(url.href)
  );
});