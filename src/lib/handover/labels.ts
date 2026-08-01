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
    step1: "1. Vérifier la personne",
    step1Hint:
      "Photographiez le client présent devant vous, puis comparez avec la photo vérifiée par CarKari. Demandez aussi la pièce d'identité physique.",
    onFile: "Photo vérifiée par CarKari",
    justTaken: "Photo prise à l'instant",
    consent:
      "Informez le client que cette photo est prise pour confirmer son identité au moment de la remise, qu'elle est conservée comme preuve en cas de litige, et supprimée 90 jours après la fin de la location.",
    confirmSame:
      "Je confirme qu'il s'agit bien de la même personne et que sa pièce d'identité physique correspond.",
    mismatch:
      "En cas de doute : ne remettez pas les clés et contactez CarKari. L'acompte sera remboursé au client.",
    notVerified:
      "Ce client n'a pas encore été vérifié par CarKari. Ne remettez pas le véhicule — demandez-lui de compléter la vérification d'identité dans son compte.",
    step2: "2. État du véhicule au départ",
    step2Hint:
      "5 photos, toujours les mêmes angles. Elles servent de référence à la restitution.",
    uploading: "Envoi de la photo…",
    customerSlot: "Photo du client",
    customerSlotHint: "Visage bien visible",
    cam: camFr,
    handover: handoverLabels.fr,
  },
  en: {
    step1: "1. Check the person",
    step1Hint:
      "Photograph the customer in front of you, then compare with the photo CarKari verified. Ask for the physical ID as well.",
    onFile: "Verified by CarKari",
    justTaken: "Just taken",
    consent:
      "Tell the customer this photo is taken to confirm their identity at handover, is kept as evidence in case of a dispute, and is deleted 90 days after the rental ends.",
    confirmSame:
      "I confirm this is the same person and their physical ID matches.",
    mismatch:
      "If in any doubt: do not release the keys and contact CarKari. The customer's deposit will be refunded.",
    notVerified:
      "This customer has not been verified by CarKari yet. Do not release the vehicle — ask them to complete identity verification in their account.",
    step2: "2. Vehicle condition at pickup",
    step2Hint:
      "Five photos, always the same angles. They are the reference for the return.",
    uploading: "Uploading photo…",
    customerSlot: "Customer photo",
    customerSlotHint: "Face clearly visible",
    cam: camEn,
    handover: handoverLabels.en,
  },
};
