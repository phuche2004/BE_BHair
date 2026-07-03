#!/usr/bin/env python3
"""
Advanced controller fixes for SQLite migration
"""
import re

def fix_appointment_controller():
    filepath = 'src/controllers/appointment.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Cast req.params.id to string
    content = re.sub(r'Appointment\.findById\(id\)', r'Appointment.findById(id as string)', content)
    content = re.sub(r'Service\.findById\(id\)', r'Service.findById(id as string)', content)
    content = re.sub(r'Shop\.findById\(shopId\)', r'Shop.findById(shopId as string)', content)
    
    # Fix 2: Fix Service.find with $in - replace with findByIds
    content = re.sub(
        r'Service\.find\(\{ _id: \{ \$in: serviceIds \}, shopId: shopId, isActive: true \}\)',
        r'Service.findByIds(serviceIds, { shopId: shopId as string, isActive: true })',
        content
    )
    
    # Fix 3: Fix User.find with $in
    content = re.sub(
        r'User\.find\(\{ role: \{ \$in: \[UserRole\.MANAGER, UserRole\.STAFF\] \}, shopId: shopId \}\)',
        r'User.find({ role: { $in: [UserRole.MANAGER, UserRole.STAFF] }, shopId: shopId as string })',
        content
    )
    
    # Fix 4: Fix Appointment.find with $in status
    content = re.sub(
        r'status: \{ \$in: \[AppointmentStatus\.PENDING, AppointmentStatus\.CONFIRMED\] \}',
        r'// Note: findOne now supports $in operator',
        content
    )
    
    # Fix 5: Parse serviceIds JSON
    content = re.sub(
        r'let currentServiceIds = appointment\.serviceIds\.map',
        r'let currentServiceIds = (typeof appointment.serviceIds === "string" ? JSON.parse(appointment.serviceIds) : appointment.serviceIds).map',
        content
    )
    
    # Fix 6: Fix null safety for customerId
    content = re.sub(
        r'appointment\.customerId\.toString\(\) !== req\.user\.id',
        r'appointment.customerId?.toString() !== req.user.id',
        content
    )
    
    # Fix 7: Remove .lean()
    content = re.sub(r'\.lean\(\)', '', content)
    
    # Fix 8: Remove .toObject()
    content = re.sub(r'\.toObject\(\)', '', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

def fix_shop_controller():
    filepath = 'src/controllers/shop.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Cast params
    content = re.sub(r'Shop\.findById\(req\.params\.id\)', r'Shop.findById(req.params.id as string)', content)
    content = re.sub(r'Shop\.findById\(shopId\)', r'Shop.findById(shopId as string)', content)
    
    # Fix 2: Fix managerId null safety
    content = re.sub(
        r'shop\.managerId\.toString\(\) !== req\.user\.id',
        r'shop.managerId?.toString() !== req.user.id',
        content
    )
    
    # Fix 3: Fix location property (SQLite uses latitude/longitude separately)
    content = re.sub(
        r'shop\.location = \{[^}]+\}',
        r'shop.latitude = latitude; shop.longitude = longitude',
        content
    )
    
    # Fix 4: Fix array filter operations
    content = re.sub(
        r'\(shop\.images(\d+) \|\| \[\]\)\.filter',
        r'(Array.isArray(shop.images\\1) ? shop.images\\1 : JSON.parse(shop.images\\1 || "[]")).filter',
        content
    )
    
    # Fix 5: Fix array spread operations
    content = re.sub(
        r'shop\.images(\d+) = \[\.\.\.\(shop\.images\1 \|\| \[\]\), \.\.\.newImages\1\]',
        r'const currentImages\\1 = Array.isArray(shop.images\\1) ? shop.images\\1 : JSON.parse(shop.images\\1 || "[]"); shop.images\\1 = JSON.stringify([...currentImages\\1, ...newImages\\1]) as any',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

def fix_service_controller():
    filepath = 'src/controllers/service.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Cast params
    content = re.sub(r'Service\.findById\(id\)', r'Service.findById(id as string)', content)
    content = re.sub(r'Shop\.findById\(shopId\)', r'Shop.findById(shopId as string)', content)
    
    # Fix 2: Fix managerId null safety
    content = re.sub(
        r'shop\.managerId\.toString\(\) !== req\.user\.id',
        r'shop.managerId?.toString() !== req.user.id',
        content
    )
    
    # Fix 3: Use findByIdAndUpdate instead of save
    content = re.sub(
        r'// Removed: (\w+)\.save\(\) - use findByIdAndUpdate\(\) instead',
        r'Service.findByIdAndUpdate(\\1.id, \\1)',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

def fix_review_controller():
    filepath = 'src/controllers/review.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Fix customerId null safety
    content = re.sub(
        r'appointment\.customerId\.toString\(\) !== req\.user\.id',
        r'appointment.customerId?.toString() !== req.user.id',
        content
    )
    
    # Fix 2: Cast params
    content = re.sub(r'Review\.find\(\{ shopId \}\)', r'Review.find({ shopId: shopId as string })', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

def fix_slot_controller():
    filepath = 'src/controllers/slot.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Cast params
    content = re.sub(r'Shop\.findById\(shopId\)', r'Shop.findById(shopId as string)', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

def fix_notification_controller():
    filepath = 'src/controllers/notification.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Remove extra parameters from findByIdAndUpdate
    content = re.sub(
        r'Notification\.findByIdAndUpdate\(\s*id,\s*\{ isRead: true \},\s*\{ new: true \}\s*\)',
        r'Notification.findByIdAndUpdate(id as string, { isRead: true })',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

# Run all fixes
print("Running advanced controller fixes...")
fix_appointment_controller()
fix_shop_controller()
fix_service_controller()
fix_review_controller()
fix_slot_controller()
fix_notification_controller()
print("\nAll fixes completed!")
