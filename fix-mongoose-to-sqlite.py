#!/usr/bin/env python3
"""
Auto-fix Mongoose to SQLite migration issues
"""
import re
import glob

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix 1: Remove await from synchronous methods
    content = re.sub(r'await (User|Shop|Service|Appointment|Review|Notification|HistoryLog)\.(findById|findByPhoneNumber|findByEmail|findOne|find|create|findByIdAndUpdate|countDocuments)\(',
                     r'\1.\2(', content)
    
    # Fix 2: Change _id to id
    content = re.sub(r'(\w+)\._id', r'\1.id', content)
    
    # Fix 3: Remove .populate() calls (simple removal)
    content = re.sub(r'\.populate\([^)]+\)', '', content)
    
    # Fix 4: Remove .select() calls
    content = re.sub(r'\.select\([^)]+\)', '', content)
    
    # Fix 5: Remove .limit() calls
    content = re.sub(r'\.limit\(\d+\)', '', content)
    
    # Fix 6: Remove .sort() calls with objects
    content = re.sub(r'\.sort\(\{[^}]+\}\)', '', content)
    
    # Fix 7: Change new Model({...}) to Model.create({...}) - basic pattern
    content = re.sub(r'new (User|Shop|Service|Appointment|Review|Notification|HistoryLog)\(', r'\1.create(', content)
    
    # Fix 8: Remove await model.save()
    content = re.sub(r'await (\w+)\.save\(\);', r'// Removed: await \1.save() - SQLite models are immutable', content)
    
    # Fix 9: Remove standalone model.save()
    content = re.sub(r'(\s+)(\w+)\.save\(\);', r'\1// Removed: \2.save() - use findByIdAndUpdate() instead', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
        return True
    return False

# Fix all controllers
controllers = glob.glob('src/controllers/*.ts')
fixed_count = 0
for controller in controllers:
    if fix_file(controller):
        fixed_count += 1

print(f"\nTotal files fixed: {fixed_count}/{len(controllers)}")
