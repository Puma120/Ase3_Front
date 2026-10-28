package expo.modules.focusmode

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// No molestar (Do Not Disturb). Cambiar el filtro exige que el usuario conceda
// "Acceso a No molestar" a la app en los ajustes del sistema (permiso
// ACCESS_NOTIFICATION_POLICY ya declarado en app.json). Se usa el modo
// "solo prioritarias": las alarmas siguen sonando.
class FocusModeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val manager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  override fun definition() = ModuleDefinition {
    Name("FocusMode")

    Function("hasAccess") { manager.isNotificationPolicyAccessGranted }

    // false si falta el acceso (no cambia nada).
    Function("setEnabled") { enabled: Boolean ->
      if (!manager.isNotificationPolicyAccessGranted) return@Function false
      manager.setInterruptionFilter(
        if (enabled) NotificationManager.INTERRUPTION_FILTER_PRIORITY
        else NotificationManager.INTERRUPTION_FILTER_ALL
      )
      true
    }

    Function("openAccessSettings") {
      context.startActivity(
        Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }
  }
}
