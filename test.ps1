$exePath = "C:\Users\Serjo\Documents\trashu\Aura.exe"
$outPath = "C:\Users\Serjo\Documents\trashu\Aura_test.png"

Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
$bitmap = $icon.ToBitmap()
$bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
