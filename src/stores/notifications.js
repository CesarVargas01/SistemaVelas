import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  let id = 0

  const addNotification = (notification) => {
    notifications.value.push({ ...notification, id: id++, show: false, progress: 100 })

    // Trigger the show animation
    setTimeout(() => {
        const notif = notifications.value.find(n => n.id === id - 1)
        if (notif) {
            notif.show = true
        }
    }, 100)

    const duration = notification.duration || 5000
    // Animate progress bar and auto-remove
    const startTime = Date.now()
    const updateProgress = () => {
        const notif = notifications.value.find(n => n.id === id - 1)
        if (!notif) return

        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, duration - elapsed)
        notif.progress = (remaining / duration) * 100

        if (remaining > 0) {
            requestAnimationFrame(updateProgress)
        } else {
            removeNotification(notif.id)
        }
    }
    requestAnimationFrame(updateProgress)
  }

  const removeNotification = (notificationId) => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index > -1) {
      notifications.value[index].show = false
      // Wait for fade-out animation before removing from array
      setTimeout(() => {
        notifications.value.splice(index, 1)
      }, 300)
    }
  }

  const showSuccess = (title, message) => {
    addNotification({ type: 'success', title, message })
  }

  const showError = (title, message) => {
    addNotification({ type: 'error', title, message, duration: 10000 })
  }

  const showWarning = (title, message) => {
    addNotification({ type: 'warning', title, message, duration: 7000 })
  }

  const showInfo = (title, message) => {
    addNotification({ type: 'info', title, message })
  }

  return {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})
