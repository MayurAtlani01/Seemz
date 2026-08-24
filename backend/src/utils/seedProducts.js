const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const REAL_PRODUCTS = [
  // ==========================================
  // MEN'S COLLECTION (12 Luxury Pieces)
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
      "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&q=80&w=1000",
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
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Heavyweight French Terry Boxy Hoodie",
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
    name: "Raw Selvedge Denim Trucker Jacket",
    brand: "SEEMZ Black Label",
    category: "Men",
    subCategory: "Jackets",
    price: 6999,
    sizes: ["S", "M", "L", "XL"],
    stock: 18,
    description:
      "Crafted from 14oz Japanese red-line selvedge denim. Rigid unwashed finish that develops unique fades and patina over time. Antique brass branded hardware.",
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Supima Cotton Heavyweight Crewneck",
    brand: "SEEMZ Studio",
    category: "Men",
    subCategory: "T-Shirts",
    price: 1999,
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: 45,
    description:
      "260 GSM heavyweight Supima cotton t-shirt with a dense micro-rib collar and reinforced blind stitching. Pre-shrunk with a velvety silicone wash.",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Camp Collar Textured Linen Shirt",
    brand: "SEEMZ Studio",
    category: "Men",
    subCategory: "Shirts",
    price: 3799,
    sizes: ["S", "M", "L", "XL"],
    stock: 22,
    description:
      "Airy pure French flax linen woven with subtle slub texture. Relaxed resort fit with an open Cuban collar, chest pocket, and straight split hem.",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1563630423918-b58f07336ac9?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Wide-Leg Relaxed Cargo Trousers",
    brand: "SEEMZ Black Label",
    category: "Men",
    subCategory: "Trousers",
    price: 4799,
    sizes: ["30", "32", "34", "36"],
    stock: 15,
    description:
      "Constructed from durable cotton-twill with articulated knee darts, concealed flap cargo pockets, and adjustable drawstring ankle cuffs.",
    images: [
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Silk-Cashmere Fine Knit Polo",
    brand: "SEEMZ Atelier",
    category: "Men",
    subCategory: "Knitwear",
    price: 5299,
    sizes: ["S", "M", "L", "XL"],
    stock: 19,
    description:
      "70% mulberry silk and 30% cashmere blend knitted in an ultra-fine 18-gauge gauge. Buttonless Johnny collar with ribbed hem and cuffs.",
    images: [
      "https://images.unsplash.com/photo-1625910513413-562a0ee68a51?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Double-Breasted Pinstripe Suit Jacket",
    brand: "SEEMZ Atelier",
    category: "Men",
    subCategory: "Blazers",
    price: 9499,
    sizes: ["S", "M", "L", "XL"],
    stock: 12,
    description:
      "Tailored in a subtle chalk pinstripe woven from Super 120s wool. Double-breasted six-button fastening, pick-stitch detailing, and twin side vents.",
    images: [
      "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1000",
    ],
  },

  // ==========================================
  // WOMEN'S COLLECTION (12 Luxury Pieces)
  // ==========================================
  {
    name: "Silk Satin Bias-Cut Slip Maxi Gown",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Dresses",
    price: 8999,
    sizes: ["XS", "S", "M", "L"],
    stock: 18,
    description:
      "Sculptural floor-length gown cut on the bias from heavyweight 22-momme mulberry silk satin. Features a delicate cowl neckline, adjustable micro-straps, and low scoop back.",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Tailored Hourglass Virgin Wool Blazer",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Blazers",
    price: 7999,
    sizes: ["XS", "S", "M", "L"],
    stock: 22,
    description:
      "Sharp architectural blazer with a sculpted cinched waist and defined shoulders. Woven in fine worsted wool with silk lapel facing and horn buttons.",
    images: [
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Ribbed Knit Turtleneck Midi Dress",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Dresses",
    price: 5999,
    sizes: ["XS", "S", "M", "L"],
    stock: 25,
    description:
      "Form-fitting ribbed midi dress knit from an ultra-soft cashmere-viscose blend. Features a high fold-over turtleneck, long sleeves, and a discreet side leg slit.",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Oversized Belted Trench Coat",
    brand: "SEEMZ Édition",
    category: "Women",
    subCategory: "Outerwear",
    price: 11499,
    sizes: ["XS", "S", "M", "L"],
    stock: 14,
    description:
      "Modern take on classic trench tailoring in water-repellent heavy cotton gabardine. Features storm flap, tortoiseshell buckles, deep side welt pockets, and back vent.",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1525450824786-227cbef70703?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Pleated Wide-Leg Palazzo Trousers",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Trousers & Skirts",
    price: 4499,
    sizes: ["XS", "S", "M", "L"],
    stock: 28,
    description:
      "High-waisted fluid trousers crafted from drapey sustainable Lyocell twill. Deep double front pleats create an elegant, flowing silhouette with side slash pockets.",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Draped Asymmetric Silk Chiffon Blouse",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Tops & Blouses",
    price: 3999,
    sizes: ["XS", "S", "M", "L"],
    stock: 20,
    description:
      "Fluid silk chiffon blouse with asymmetrical scarf drape detailing around the neckline. Relaxed fit with clean French seams and mother-of-pearl buttoned cuffs.",
    images: [
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Pure Cashmere Cropped Cardigan",
    brand: "SEEMZ Black Label",
    category: "Women",
    subCategory: "Knitwear",
    price: 5799,
    sizes: ["XS", "S", "M", "L"],
    stock: 15,
    description:
      "Pure Mongolian 2-ply cashmere knit into a modern boxy cropped cardigan. Features deep V-neckline, ribbed trims, and real mother-of-pearl buttons.",
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Structured Linen Waistcoat & Short Co-ord",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Co-ord Sets",
    price: 6499,
    sizes: ["XS", "S", "M", "L"],
    stock: 16,
    description:
      "Tailored two-piece set in pure European flax linen. Sleeveless tailored waistcoat with matching high-rise pleat-front tailored shorts with slant pockets.",
    images: [
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Column Silhouette Bias Satin Midi Skirt",
    brand: "SEEMZ Studio",
    category: "Women",
    subCategory: "Trousers & Skirts",
    price: 3499,
    sizes: ["XS", "S", "M", "L"],
    stock: 24,
    description:
      "High-waist midi slip skirt in lustrous heavy satin. Clean elasticated waistband with a streamlined bias drape that gently skims the hips down to an ankle-grazing hem.",
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Sculpted Square-Neck Modal Bodysuit",
    brand: "SEEMZ Black Label",
    category: "Women",
    subCategory: "Tops & Blouses",
    price: 2499,
    sizes: ["XS", "S", "M", "L"],
    stock: 35,
    description:
      "Double-layered compressive modal bodysuit designed with an architectural square neckline, wide shoulder straps, and a seamless thong base for a completely smooth finish.",
    images: [
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Draped Halterneck Evening Cocktail Dress",
    brand: "SEEMZ Atelier",
    category: "Women",
    subCategory: "Dresses",
    price: 7499,
    sizes: ["XS", "S", "M", "L"],
    stock: 14,
    description:
      "Elegant halterneck cocktail dress tailored from fluid crepe de chine. Features gathered neck ties, open back silhouette, and fluted asymmetrical hem.",
    images: [
      "https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    name: "Double-Faced Wool Wrap Coat",
    brand: "SEEMZ Édition",
    category: "Women",
    subCategory: "Outerwear",
    price: 13999,
    sizes: ["XS", "S", "M", "L"],
    stock: 10,
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
    console.log(` Successfully seeded ${inserted.length} realistic products across Men & Women categories!`);

    const menCount = inserted.filter((p) => p.category === "Men").length;
    const womenCount = inserted.filter((p) => p.category === "Women").length;
    console.log(`- Men's pieces: ${menCount}`);
    console.log(`- Women's pieces: ${womenCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
}

seed();
