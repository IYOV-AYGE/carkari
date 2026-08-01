import type { PickupLabels } from "@/components/PickupFlow";
import type { HandoverLabels } from "@/components/HandoverForm";

/** Shared camera strings — the capture UI is identical everywhere. */
const camFr = {
  take: "Prendre la photo", retake: "Reprendre", capture: "Capturer",
  cancel: "Annuler", optional: "facultatif",
  denied: "Accès à l'appareil photo refusé. Autorisez la caméra, puis réessayez.",
  unsupported: "Votre navigateur ne permet pas la prise de photo. Utilisez Chrome ou Safari.",
  guide: "Cadrez l'ensemble du véhicule dans le rectangle",
  guideSelfie: "Cadrez le visage",
};
const camEn = {
  take: "Take photo", retake: "Retake", capture: "Capture",
  cancel: "Cancel", optional: "optional",
  denied: "Camera access denied. Allow the camera, then try again.",
  unsupported: "Your browser can't take photos. Use Chrome or Safari.",
  guide: "Fit the whole vehicle inside the rectangle",
  guideSelfie: "Frame the face",
};

export const handoverLabels: Record<"fr" | "en", HandoverLabels> = {
  fr: {
    angles: {
      front: "Avant", rear: "Arrière", left: "Côté gauche",
      right: "Côté droit", interior: "Intérieur",
    },
    angleHints: {
      front: "Face avant complète", rear: "Face arrière complète",
      left: "Tout le flanc gauche", right: "Tout le flanc droit",
      interior: "Tableau de bord et sièges",
    },
    odometer: "Kilométrage",
    fuel: "Niveau de carburant",
    fuelHint: "En huitièmes, comme sur la jauge.",
    notes: "Observations",
    notesHint: "Rayures, impacts, propreté, accessoires manquants…",
    submitPickup: "Confirmer la remise des clés",
    submitReturn: "Enregistrer la restitution",
    sending: "Envoi…",
    errPhotos: "Les 5 photos sont obligatoires.",
    errGeneric: "Une erreur est survenue. Réessayez.",
    cam: camFr,
  },
  en: {
    angles: {
      front: "Front", rear: "Rear", left: "Left side",
      right: "Right side", interior: "Interior",
    },
    angleHints: {
      front: "Whole front of the car", rear: "Whole rear",
      left: "Full left flank", right: "Full right flank",
      interior: "Dashboard and seats",
    },
    odometer: "Odometer",
    fuel: "Fuel level",
    fuelHint: "In eighths, as shown on the gauge.",
    notes: "Notes",
    notesHint: "Scratches, dents, cleanliness, missing accessories…",
    submitPickup: "Confirm handover of keys",
    submitReturn: "Record the return",
    sending: "Uploading…",
    errPhotos: "All 5 photos are required.",
    errGeneric: "Something went wrong. Try again.",
    cam: camEn,
  },
};

export const pickupLabels: Record<"fr" | "en", PickupLabels> = {
  fr: {
    step1: "1. Vérification du client",
    step1Hint:
      "Photographiez le client présent devant vous. CarKari vérifie automatiquement qu'il s'agit bien de la personne dont l'identité a été validée.",
    checking: "Vérification en cours…",
    matched: "✓ Identité confirmée — vous pouvez remettre les clés.",
    notMatched: "✗ Ce n'est PAS le client vérifié. Ne remettez pas les clés.",
    notMatchedWhat:
      "Reprenez la photo en pleine lumière, visage dégagé, sans lunettes de soleil ni casquette. Si le résultat reste négatif, contactez CarKari : l'acompte sera remboursé au client.",
    unavailable:
      "Vérification automatique impossible sur cet appareil. Contrôlez la pièce d'identité physique du client.",
    failed:
      "La vérification n'a pas abouti. Contrôlez la pièce d'identité physique du client.",
    fallbackConfirm:
      "Je confirme avoir contrôlé la pièce d'identité physique et qu'elle correspond à la personne présente.",
    privacy:
      "Vous ne voyez jamais les pièces d'identité du client : CarKari les conserve et effectue seul la comparaison. Votre appareil ne reçoit qu'une empreinte numérique, jamais la photo.",
    consent:
      "Informez le client : cette photo sert uniquement à confirmer son identité à la remise, elle est conservée comme preuve en cas de litige et supprimée 90 jours après la fin de la location.",
    notVerified:
      "Ce client n'a pas encore été vérifié par CarKari. Ne remettez pas le véhicule — demandez-lui de compléter la vérification d'identité dans son compte.",
    step2: "2. État du véhicule au départ",
    step2Hint:
      "5 photos, toujours les mêmes angles. Elles servent de référence à la restitution.",
    customerSlot: "Photo du client",
    customerSlotHint: "Visage de face, bien éclairé",
    cam: camFr,
    handover: handoverLabels.fr,
  },
  en: {
    step1: "1. Check the customer",
    step1Hint:
      "Photograph the customer in front of you. CarKari automatically confirms whether this is the person whose identity we verified.",
    checking: "Checking…",
    matched: "✓ Identity confirmed — you may hand over the keys.",
    notMatched: "✗ This is NOT the verified customer. Do not hand over the keys.",
    notMatchedWhat:
      "Retake the photo in good light, face clear, no sunglasses or cap. If it still fails, contact CarKari — the customer's deposit will be refunded.",
    unavailable:
      "Automatic check could not run on this device. Check the customer's physical ID document.",
    failed:
      "The check did not complete. Check the customer's physical ID document.",
    fallbackConfirm:
      "I confirm I checked the physical ID and it matches the person present.",
    privacy:
      "You never see the customer's identity documents: CarKari holds them and performs the comparison. Your device receives only a numeric fingerprint, never the photo.",
    consent:
      "Tell the customer: this photo is used only to confirm their identity at handover, is kept as evidence in case of a dispute, and is deleted 90 days after the rental ends.",
    notVerified:
      "This customer has not been verified by CarKari yet. Do not release the vehicle — ask them to complete identity verification in their account.",
    step2: "2. Vehicle condition at pickup",
    step2Hint:
      "Five photos, always the same angles. They are the reference for the return.",
    customerSlot: "Customer photo",
    customerSlotHint: "Face straight on, well lit",
    cam: camEn,
    handover: handoverLabels.en,
  },
};
