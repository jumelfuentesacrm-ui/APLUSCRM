# Entrega de nuevo cliente — checklist de 15 minutos

Sigue estos pasos en orden. Con práctica toma menos de 10 minutos.

---

## 1 · GitHub (~1 min)

1. Ve a `https://github.com/jumelfuentesacrm-ui/APLUSCRM`
2. **Fork** el repo al GitHub del cliente (o crea un repo nuevo y sube el código).
3. Anota la URL del nuevo repo.

---

## 2 · Supabase (~4 min)

1. `https://supabase.com` → **New project** → ponle el nombre del cliente.
2. Copia la **Project URL** y las **API Keys** (anon + service_role) — están en *Settings → API*.
3. Ve a **SQL Editor** → pega TODO el contenido de `schema.sql` → **Run**.
4. Ve a *Authentication → Settings → Email* → desactiva confirmación de email (para pruebas rápidas).
5. Crea el usuario admin: *Authentication → Users → Add user* → email + contraseña del cliente.
6. En SQL Editor, hazlo admin:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '<uuid-del-usuario>';
   ```

---

## 3 · VAPID keys (~1 min)

Genera keys para este cliente (una vez por proyecto):

```bash
npx web-push generate-vapid-keys
```

Guarda ambas keys — las necesitas en el siguiente paso.

---

## 4 · Vercel (~4 min)

1. `https://vercel.com` → **Add New Project** → importa el repo del paso 1.
2. En **Environment Variables**, añade TODAS estas variables:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key de Supabase |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | public key del paso 3 |
| `VAPID_PRIVATE_KEY` | private key del paso 3 |
| `NEXT_PUBLIC_BRAND_NAME` | Nombre corto del negocio |
| `NEXT_PUBLIC_BUSINESS_NAME` | Nombre legal completo |
| `NEXT_PUBLIC_PHONE` | Teléfono en formato +1XXXXXXXXXX |
| `NEXT_PUBLIC_WHATSAPP` | Teléfono sin + ni espacios |
| `NEXT_PUBLIC_EMAIL` | Email de contacto |
| `NEXT_PUBLIC_LOCATION` | Ciudad, PR |
| `NEXT_PUBLIC_WEBSITE` | URL del sitio (el mismo de Vercel) |
| `NEXT_PUBLIC_TAX_RATE` | 0.115 (IVU PR) o el que aplique |
| `NEXT_PUBLIC_COLOR_GOLD` | Color principal del cliente en hex |

3. Haz clic en **Deploy**.

---

## 5 · Dominio (~2 min)

1. En Vercel → *Settings → Domains* → añade el dominio del cliente.
2. Apunta el DNS del dominio a Vercel (CNAME `cname.vercel-dns.com` o los nameservers de Vercel).
3. Vercel emite el SSL automáticamente.

---

## 6 · Prueba final (~2 min)

- [ ] Abre el sitio público → llena el formulario de booking → verifica que llega a Supabase.
- [ ] Abre `/login` → entra con las credenciales del cliente → verifica el panel admin.
- [ ] En admin → activa las notificaciones push → confirma que llega una notificación de prueba.
- [ ] Revisa que el nombre, teléfono y colores del cliente aparezcan correctos en el sitio.

---

## Extras opcionales

- **Stripe**: si el cliente quiere cobrar tarjetas de lealtad, añade `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
- **Dominio de email**: configura el dominio en Resend o SendGrid y añade la variable de API key.
- **Branding profundo**: entrega el `brand-kit-template.html` → el cliente llena colores, fuentes y servicios → tú actualizas las env vars en Vercel y redeploy en 30 segundos.

---

## Variables de referencia rápida

Ver `.env.example` para la lista completa con comentarios.
