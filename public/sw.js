self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'A+ CRM'
  const options = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: data.bookingId ? 'booking-' + data.bookingId : 'aplus-notif',
    renotify: true,
    data: { url: data.url || '/admin', bookingId: data.bookingId || null },
    actions: data.actions || []
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const notifData = event.notification.data || {}
  const bookingId  = notifData.bookingId
  let targetUrl    = notifData.url || '/admin'

  if (event.action === 'confirm' && bookingId) {
    targetUrl = '/admin?confirm=' + bookingId
  } else if (event.action === 'view' && bookingId) {
    targetUrl = '/admin?view=' + bookingId
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      // If admin is already open, navigate that tab instead of opening a new one
      for (const c of cs) {
        if (c.url.includes('/admin')) {
          c.navigate(targetUrl)
          return c.focus()
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
