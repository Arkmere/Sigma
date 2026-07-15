export const categories = [
  'General body dimensions', 'Upper body', 'Lower body', 'Head and neck', 'Hands', 'Feet',
  'Jewellery', 'Clothing', 'Footwear', 'Sports equipment', 'Specialist wearables', 'Custom',
] as const;

export const measurementOptions: Record<string, readonly string[]> = {
  'General body dimensions': ['Height', 'Weight', 'Shoulder width', 'Arm span', 'Torso length', 'Body rise'],
  'Upper body': ['Chest', 'Bust', 'Underbust', 'Waist', 'Neck/collar', 'Shoulder width', 'Sleeve length', 'Bicep circumference', 'Forearm circumference', 'Wrist circumference', 'Back length'],
  'Lower body': ['Hip', 'Seat', 'Inseam', 'Outseam', 'Inside leg', 'Thigh circumference', 'Knee circumference', 'Calf circumference', 'Ankle circumference', 'Front rise', 'Back rise'],
  'Head and neck': ['Head circumference', 'Hat size', 'Neck/collar', 'Face width', 'Pupillary distance', 'Glasses frame width'],
  Hands: ['Hand length', 'Palm width', 'Hand circumference', 'Middle finger length', 'Glove size'],
  Feet: ['Foot length', 'Foot width', 'Arch length', 'Instep circumference', 'Ball girth', 'Heel-to-ball length'],
  Jewellery: ['Ring size', 'Ring finger circumference', 'Wrist circumference', 'Bracelet size', 'Necklace length', 'Watch strap length'],
  Clothing: ['T-shirt size', 'Shirt size', 'Jacket size', 'Coat size', 'Dress size', 'Skirt size', 'Trouser size', 'Jeans waist', 'Jeans length', 'Bra size', 'Belt size', 'Uniform/workwear size'],
  Footwear: ['General shoe size', 'Trainer/sneaker size', 'Boot size', 'Dress shoe size', 'Skate size', 'Ski boot size', 'Cycling shoe size', 'Brand-specific shoe size'],
  'Sports equipment': ['Bike frame size', 'Helmet size', 'Skate size', 'Shin guard size', 'Hockey stick length', 'Glove size', 'Protective pad size', 'Wetsuit size', 'Climbing harness size'],
  'Specialist wearables': ['Watch strap length', 'Medical/support garment size', 'Compression garment size', 'PPE size', 'Respirator mask size', 'Safety harness size', 'Orthotic size', 'Prosthetic/socket measurement'],
  Custom: ['Custom measurement', 'Custom clothing size', 'Custom equipment size', 'Other recorded fit fact'],
};
