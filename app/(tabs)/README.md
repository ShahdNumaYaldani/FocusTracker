# FocusTracker

FocusTracker, kullanıcıların odaklanma sürelerini takip edebilmesi ve dikkat
dağınıklıklarını analiz edebilmesi için geliştirilmiş bir mobil uygulamadır.
Uygulama Expo (React Native) kullanılarak geliştirilmiştir.

Uygulama içerisinde varsayılan olarak 25 dakikalık bir odaklanma süresi
bulunmaktadır ve bu süre ±5 dakika olacak şekilde ayarlanabilmektedir.
Kullanıcılar oturum başlamadan önce kategori seçimi yapabilmektedir
(Ders Çalışma, Kodlama, Proje, Kitap Okuma).

Oturum sırasında uygulama arka plana alındığında dikkat dağınıklığı sayacı
artırılmakta ve oturum otomatik olarak durdurulmaktadır. Oturum sona erdiğinde
veya duraklatıldığında, oturum süresi, seçilen kategori ve dikkat dağınıklığı
bilgilerini içeren bir özet ekranı kullanıcıya gösterilmektedir.

Tüm oturum verileri cihaz üzerinde AsyncStorage kullanılarak saklanmaktadır.
Kaydedilen veriler raporlar ekranında kullanıcıya sunulmaktadır. Bu ekranda
günlük ve toplam odaklanma süreleri, son 7 güne ait Bar Chart, kategoriye göre
Pie Chart ve oturum geçmişi listesi yer almaktadır.

Projede kullanılan teknolojiler:
- Expo (React Native)
- AsyncStorage
- react-native-chart-kit
- react-native-svg

Uygulamayı çalıştırmak için gerekli paketler yüklendikten sonra
`npx expo start` komutu çalıştırılır ve uygulama Expo Go üzerinden test edilir.
Uygulama Expo Go kullanılarak gerçek cihaz üzerinde test edilmiştir.
