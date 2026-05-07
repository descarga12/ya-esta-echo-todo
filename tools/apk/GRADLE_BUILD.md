# Compilar APK con Gradle Localmente

## Requisitos
- Java JDK 17 instalado
- Android SDK (opcional, Gradle lo descarga automáticamente)

## Pasos

### 1. Descargar gradle-wrapper.jar

Abre **cmd** o **PowerShell** en la carpeta del proyecto y ejecuta:

```powershell
cd android\gradle\wrapper
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar' -OutFile 'gradle-wrapper.jar'
```

O con curl:
```bash
cd android\gradle\wrapper
curl -L -o gradle-wrapper.jar https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar
```

### 2. Compilar assets web

```bash
cd ..\..\..  # Volver a la raíz del proyecto
pnpm build:client
```

### 3. Copiar assets a Android

```bash
mkdir android\app\src\main\assets\public 2>nul
xcopy /s /e /y dist\spa\* android\app\src\main\assets\public\
```

### 4. Compilar APK

```bash
cd android
.\gradlew.bat assembleDebug --console=plain --no-daemon
```

Esto tomará **5-10 minutos** la primera vez (descarga Gradle y dependencias).

### 5. Obtener el APK

El APK se generará en:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

Cópialo a la raíz:
```bash
copy android\app\build\outputs\apk\debug\app-debug.apk QR-Inventario.apk
```

---

## Solución de problemas

### Error: "gradle-wrapper.jar no encontrado"
Descárgalo manualmente desde:
https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar

Y guárdalo en `android\gradle\wrapper\gradle-wrapper.jar`

### Error: "JAVA_HOME no está configurado"
Configura la variable de entorno JAVA_HOME apuntando a tu JDK 17.

---

## Alternativa más simple: GitHub Actions

Si los pasos locales fallan, usa GitHub Actions (ya configurado):

1. Sube cambios a GitHub: `git push`
2. Ve a https://github.com/descarga12/proyecto-fima/actions
3. Ejecuta el workflow "Build Android APK"
4. Descarga el APK desde Artifacts
