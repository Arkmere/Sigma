export const categories = [
  'General body dimensions', 'Upper body', 'Lower body', 'Head and neck', 'Hands', 'Feet',
  'Jewellery', 'Clothing', 'Footwear', 'Sports equipment', 'Specialist wearables', 'Custom',
] as const;

export const measurementOptions: Record<string, readonly string[]> = {
  'General body dimensions': ['Height', 'Weight', 'Shoulder width'],
  'Upper body': ['Chest', 'Waist', 'Neck/collar', 'Sleeve length', 'Torso length'],
  'Lower body': ['Hip', 'Inseam', 'Outseam', 'Thigh', 'Calf'],
  'Head and neck': ['Head circumference', 'Neck/collar'],
  Hands: ['Hand length', 'Palm width'],
  Feet: ['Foot length', 'Foot width'],
  Jewellery: ['Ring finger circumference', 'Wrist circumference'],
  Clothing: ['Body length'],
  Footwear: ['Foot length'],
  'Sports equipment': ['Bike frame measurement'],
  'Specialist wearables': ['Watch strap length'],
  Custom: ['Custom measurement'],
};
