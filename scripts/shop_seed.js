// MongoDB Shell Command to import Shop data
// Usage: Paste this into mongosh or run with: mongosh "mongodb://localhost:27017/b_hair" scripts/shop_seed.js

const shops = [
    {
        name: "30Shine Cầu Giấy",
        address: "123 Cầu Giấy, Hà Nội",
        gender: "MALE", // Enum: MALE, FEMALE, BOTH
        location: {
            type: "Point",
            coordinates: [105.7900, 21.0300] // [Longitude, Latitude]
        },
        phone: "19001001",
        images1: ["https://example.com/cg1.jpg", "https://example.com/cg2.jpg"],
        images2: ["https://example.com/cg3.jpg"],
        images3: [],
        managerId: new ObjectId(), // Placeholder - Replace with actual User ObjectId if needed
        averageRating: 4.8,
        totalReviews: 120,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Liêm Barber Shop",
        address: "456 Đê La Thành, Hà Nội",
        gender: "MALE",
        location: {
            type: "Point",
            coordinates: [105.8200, 21.0200]
        },
        phone: "0909090909",
        images1: ["https://example.com/lb1.jpg"],
        images2: [],
        images3: [],
        managerId: new ObjectId(),
        averageRating: 4.5,
        totalReviews: 85,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Hair Salon Thuý Hằng",
        address: "789 Nguyễn Trãi, Hà Nội",
        gender: "FEMALE",
        location: {
            type: "Point",
            coordinates: [105.8000, 20.9900]
        },
        phone: "0888888888",
        images1: ["https://example.com/th1.jpg"],
        images2: [],
        images3: [],
        managerId: new ObjectId(),
        averageRating: 4.9,
        totalReviews: 200,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "1900 Hair Salon",
        address: "10 Nguyễn Hy Quang, Hà Nội",
        gender: "BOTH",
        location: {
            type: "Point",
            coordinates: [105.8250, 21.0150]
        },
        phone: "0912345678",
        images1: ["https://example.com/1900_1.jpg"],
        images2: ["https://example.com/1900_2.jpg"],
        images3: [],
        managerId: new ObjectId(),
        averageRating: 4.7,
        totalReviews: 150,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Switch to the correct database if not already selected
// use('b_hair'); 

try {
    const result = db.shops.insertMany(shops);
    print(`Successfully inserted ${result.insertedIds.length} shops.`);
} catch (e) {
    print("Error inserting shops:", e);
}
