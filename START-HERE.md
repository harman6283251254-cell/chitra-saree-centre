# Chitra Saree Centre — Your Website, Explained Simply

No tech jargon. Just what you need to know to run your site.

## 1. What this is
A complete website for your shop: customers can browse and order online, and you
manage everything (products, stock, orders) from a simple admin panel — no coding.

## 2. Starting the site (for your developer, one-time setup)
1. Create a free project at supabase.com
2. Run the file `supabase/schema.sql` then `supabase/seed.sql` in Supabase's SQL editor
3. Copy `.env.example` to `.env.local` and fill in the Supabase keys from your project settings
4. Run `npm install` then `npm run build` and `npm start`
5. Create your admin login: `npm run create-admin -- youremail@example.com "YourPassword123"`

Once this is done, you never touch code again.

## 3. Logging into your admin panel
Go to **yoursite.com/admin/login** and sign in with the email/password from step 5 above.
Keep this password private — anyone who has it can edit your shop.

## 4. Adding a product
1. Admin panel → **Products** → **+ Add Product**
2. Fill in: name, category, subcategory, fabric, work type, description
3. Enter MRP (original price) and Selling Price (customers see the discount automatically)
4. Enter how many pieces you have in stock
5. Upload photos — add several, tap one to make it the "main" photo shown first
6. Tick "Featured" / "New Arrival" / "Best Seller" if you want it highlighted on the homepage
7. Tap **Save** — it appears on your website immediately

## 5. Changing a price or photo later
Products → find the item → **Edit** → change price/stock/photos → **Save**.

## 6. Updating stock quickly
Products list → type the new stock number directly in the Stock box next to any item.
When stock hits 0, the site automatically shows "Out of stock" and stops orders for it.

## 7. Seeing and managing orders
Admin panel → **Orders**. Tap any order to see what was ordered, the customer's phone
number and address, and to update its status (Confirmed → Packed → Shipped → Delivered).
If WhatsApp is connected (see below), the customer gets a message when you update the status.

## 8. Categories, fabrics, work types
Admin panel → **Categories** — add/remove/rename anything here, and it instantly
appears in the "Add Product" form and on your website menu. No code needed.

## 9. What already works right now
- Full customer website: browse, search, filter, product pages, cart, checkout
- Three payment options: Razorpay (online cards/UPI), your own UPI QR code, Cash on Delivery
- Order tracking page for customers
- Admin login, product management, stock, order management, categories, settings
- WhatsApp "chat about this product" button on every product (opens WhatsApp with the product name pre-filled)
- Mobile-friendly on all pages

## 10. What needs your credentials before it's "live"
| Feature | What you need | Where to add it |
|---|---|---|
| Real online card/UPI payments | Razorpay account (test mode is on by default — no real money moves yet) | `.env.local` — RAZORPAY_KEY_ID etc. |
| WhatsApp auto-messages to customers | A Meta WhatsApp Business API account | `.env.local` — WHATSAPP_ACCESS_TOKEN etc. |
| Auto-posting products to Instagram | A Meta Instagram Business API account | `.env.local` — INSTAGRAM_ACCESS_TOKEN etc. |

Until these are filled in, those buttons stay in a clearly marked "not configured yet" /
demo state — the rest of the site works normally. **We never ask you for your bank
password, UPI PIN, OTP, or card CVV — those are not needed anywhere in this system.**

## 11. Demo products
The site currently has 9 sample products (marked "Demo") so you can see how everything
looks. Admin panel → Products → **Remove demo products** button deletes all of them
in one tap once you've added your real ones.
