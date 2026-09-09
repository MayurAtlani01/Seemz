const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const REAL_PRODUCTS = [
  // ==========================================
  // MEN'S CLOTHING COLLECTION (12 Luxury Pieces)
  // ==========================================
  {
    name: "Structured Double-Breasted Wool Blazer",
    brand: "SEEMZ Atelier",
    category: "Men",
    subCategory: "Blazers",
    price: 8499,
    sizes: ["S", "M", "L", "XL"],
    stock: 16,
    description:
      "Meticulously tailored from an Italian virgin wool blend, featuring sharp peaked lapels, structured padded shoulders, and natural horn buttons. Designed for a razor-sharp, modern formal silhouette.",
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Minimalist Poplin Oversized Shirt",
    brand: "SEEMZ Studio",
    category: "Men",
    subCategory: "Shirts",
    price: 3299,
    sizes: ["S", "M", "L", "XL"],
    stock: 28,
    description:
      "Crafted from 100% long-staple Egyptian cotton poplin with a crisp hand feel. Cut for a relaxed, contemporary drape with mother-of-pearl buttons and a clean concealed placket.",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1620012253295-c15c429f66bf?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Heavyweight Boxy French Terry Hoodie",
    brand: "SEEMZ Black Label",
    category: "Men",
    subCategory: "Outerwear",
    price: 4599,
    sizes: ["S", "M", "L", "XL"],
    stock: 32,
    description:
      "500 GSM organic French terry cotton with dropped shoulders, seamless kangaroo pocket, and double-layered hood. Finished with subtle tonal embroidered monogram on the sleeve.",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Tailored Pleated Flannel Trousers",
    brand: "SEEMZ Atelier",
    category: "Men",
    subCategory: "Trousers",
    price: 5499,
    sizes: ["30", "32", "34", "36"],
    stock: 20,
    description:
      "Single-pleat wool flannel trousers with an extended waistband tab, side adjusters, and a subtle tapered leg. Ideal for pairing with relaxed knitwear or formal tailoring.",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Chunky Ribbed Merino Wool Sweater",
    brand: "SEEMZ Studio",
    category: "Men",
    subCategory: "Knitwear",
    price: 6299,
    sizes: ["S", "M", "L", "XL"],
    stock: 14,
    description:
      "Spun from 100% extrafine Australian merino wool with a tactile 5-gauge fisherman rib knit. Delivers exceptional warmth, texture, and natural breathability.",
    images: [
      "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Classic Cashmere-Blend Tailored Overcoat",
    brand: "SEEMZ Édition",
    category: "Men",
    subCategory: "Outerwear",
    price: 12999,
    sizes: ["M", "L", "XL"],
    stock: 10,
    description:
      "Full-length single-breasted overcoat tailored from a warm cashmere-wool blend. Features notched lapels, deep welt pockets, and a smooth cupro jacquard lining.",
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Relaxed Raw Selvedge Denim Jacket",
    brand: "SEEMZ Black Label",
    category: "Men",
    subCategory: "Outerwear",
    price: 6999,
    sizes: ["S", "M", "L", "XL"],
    stock: 18,
    description:
      "14oz unwashed Japanese red-line selvedge denim. Boxy, slightly cropped trucker silhouette with matte gunmetal branded shank hardware.",
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Heavyweight 280 GSM Interlock Boxy Tee",
    brand: "SEEMZ Studio",
    category: "Men",
    subCategory: "T-Shirts",
    price: 2499,
    sizes: ["S", "M", "L", "XL"],
    stock: 40,
    description:
      "Dense, substantial 280 GSM combed organic cotton with a tight bound collar and dropped shoulders. Maintains its architectural boxy shape wash after wash.",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Double-Pleat Wide Leg Chino",
    brand: "SEEMZ Atelier",
    category: "Men",
    subCategory: "Trousers",
    price: 4999,
    sizes: ["30", "32", "34", "36"],
    stock: 22,
    description:
      "Crafted from premium heavy cotton twill with deep double front pleats and a relaxed wide-leg profile that breaks gracefully over tailoring or boots.",
    images: [
      "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Fine-Gauge Mock Neck Silk-Cotton Knit",
    brand: "SEEMZ Édition",
    category: "Men",
    subCategory: "Knitwear",
    price: 4799,
    sizes: ["S", "M", "L", "XL"],
    stock: 19,
    description:
      "Luxurious blend of 70% mulberry silk and 30% Egyptian cotton. Offers a gentle lustrous sheen, lightweight thermal regulation, and a modern clean mock neckline.",
    images: [
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Architectural Trench Coat in Technical Twill",
    brand: "SEEMZ Atelier",
    category: "Men",
    subCategory: "Outerwear",
    price: 11499,
    sizes: ["M", "L", "XL"],
    stock: 12,
    description:
      "Water-resistant dense gabardine twill with a storm flap, throat latch, raglan sleeves, and a deep belt. Combines heritage craftsmanship with modern avant-garde proportions.",
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Relaxed Cuban Collar Linen-Cotton Shirt",
    brand: "SEEMZ Studio",
    category: "Men",
    subCategory: "Shirts",
    price: 3499,
    sizes: ["S", "M", "L", "XL"],
    stock: 25,
    description:
      "Breathable French flax linen blended with soft combed cotton. Features an open camp collar, straight hem, and subtle tonal mother-of-pearl buttons.",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1000",
    ],
  },

  // ==========================================
  // WOMEN'S CLOTHING COLLECTION (12 Luxury Pieces)
  // ==========================================
  {
    name: "Sculptural Double-Breasted Wool Blazer",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Blazers",
    price: 8999,
    sizes: ["XS", "S", "M", "L"],
    stock: 15,
    description:
      "Hourglass-tailored double-breasted blazer with accentuated waist and sharp padded shoulders. Crafted from fine virgin wool with silk lining and internal chest canvassing.",
    images: [
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Fluid Silk Satin Column Maxi Dress",
    brand: "SEEMZ Édition",
    category: "Women",
    subCategory: "Dresses",
    price: 9499,
    sizes: ["XS", "S", "M", "L"],
    stock: 12,
    description:
      "Bias-cut 100% heavyweight mulberry silk satin with a delicate drape, scoop neckline, and graceful floor-skimming hem. Epitome of evening minimalism.",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "High-Waisted Wide-Leg Tailored Trousers",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Trousers",
    price: 5299,
    sizes: ["26", "28", "30", "32"],
    stock: 24,
    description:
      "Impeccably tailored trousers with a high-rise structured waistband, front inverted pleats, and a fluid pooling hem. Cut from lightweight crepe wool.",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Ribbed Cashmere Turtleneck Sweater",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Knitwear",
    price: 7499,
    sizes: ["XS", "S", "M", "L"],
    stock: 18,
    description:
      "100% Grade-A Mongolian cashmere knitted in a refined 7-gauge half-cardigan stitch. Exceptionally soft, with elongated ribbed cuffs and a relaxed foldover collar.",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Oversized Minimalist Trench Coat",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Coats",
    price: 13999,
    sizes: ["XS", "S", "M", "L"],
    stock: 9,
    description:
      "Generously cut double-breasted trench in compact water-repellent cotton gabardine. Features wide notched lapels, epaulettes, and a statement belt.",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1548624313-039e222995d4?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Asymmetrical Pleated Crepe Midi Skirt",
    brand: "SEEMZ Black Label",
    category: "Women",
    subCategory: "Skirts",
    price: 4999,
    sizes: ["XS", "S", "M", "L"],
    stock: 22,
    description:
      "Sharp accordion pleats on structured Japanese triacetate crepe. Designed with an asymmetrical diagonal hemline that creates dynamic motion as you walk.",
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Draped Silk-Georgette Blouse",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Tops",
    price: 4199,
    sizes: ["XS", "S", "M", "L"],
    stock: 20,
    description:
      "Semi-sheer silk georgette with an elegant fluid necktie that can be styled into a bow or left draped loose. Balloon sleeves with extended buttoned cuffs.",
    images: [
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Tailored Wool Halter Vest",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Tops",
    price: 3899,
    sizes: ["XS", "S", "M", "L"],
    stock: 17,
    description:
      "Modern sartorial waistcoat cut from lightweight tropical wool. Features an open back, pointed hem, welt pockets, and real horn buttons.",
    images: [
      "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Sculptural Wool Knit Cocoon Cardigan",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Knitwear",
    price: 6799,
    sizes: ["XS", "S", "M", "L"],
    stock: 14,
    description:
      "Cocoon-silhouette cardigan spun from thick alpaca-wool blend. Features oversized tortoiseshell buttons, dropped shoulders, and clean integrated pockets.",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Clean-Cut Organic Poplin Shirtdress",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Dresses",
    price: 5899,
    sizes: ["XS", "S", "M", "L"],
    stock: 21,
    description:
      "Crisp organic cotton poplin midi shirtdress featuring a concealed placket, spread collar, and removable tie belt for versatile architectural styling.",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Minimalist Boxy Crewneck Tee in Mercerized Cotton",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Tops",
    price: 2399,
    sizes: ["XS", "S", "M", "L"],
    stock: 35,
    description:
      "Silky-smooth double-mercerized Pima cotton with a slight natural sheen. Clean neck binding and modern elbow-length relaxed sleeves.",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Hand-Finished Double-Faced Wool Wrap Coat",
    brand: "SEEMZ Édition",
    category: "Women",
    subCategory: "Coats",
    price: 15499,
    sizes: ["XS", "S", "M", "L"],
    stock: 8,
    description:
      "Hand-finished double-faced wool wrap coat with an exaggerated shawl collar, kimono-style sleeves, and a removable self-tie belt. Pure understated luxury for cooler seasons.",
    images: [
      "https://images.unsplash.com/photo-1548624313-039e222995d4?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=1000",
    ],
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB Atlas.");

    // Delete existing products
    const deleted = await Product.deleteMany({});
    console.log(` Cleared ${deleted.deletedCount} existing items from database.`);

    // Insert new authentic products
    const inserted = await Product.insertMany(REAL_PRODUCTS);
    console.log(` Successfully seeded ${inserted.length} realistic clothing products across Men & Women categories!`);

    const menCount = inserted.filter((p) => p.category === "Men").length;
    const womenCount = inserted.filter((p) => p.category === "Women").length;
    console.log(`- Men's apparel: ${menCount}`);
    console.log(`- Women's apparel: ${womenCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
}

seed();
