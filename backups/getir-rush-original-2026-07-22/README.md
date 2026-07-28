# Getir Rush

Üç dakikalık, masaüstü tarayıcıda oynanan teslimat roguelite dikey dilimi.

## Çalıştırma

```bash
npm run dev
```

Ardından `http://localhost:4173` adresini açın. WASD veya yön tuşlarıyla hareket edin; perk seçimlerinde kartlara tıklayın ya da 1–3 tuşlarını kullanın.

## Kontroller

- WASD / yön tuşları: hareket
- 1, 2, 3: perk seçimi
- Sipariş alma ve teslim etme: otomatik

## Doğrulama

```bash
npm test
npm run check
```

Bu dikey dilim bağımlılıksız Canvas modülü kullanır. Oyun kuralları UI'dan ayrıdır; şirket betasında aynı veri modeli Phaser sahnesine, menü ve leaderboard ise React kabuğuna taşınabilir.
