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
      "Photographiez le client présent devant vous. CarKari compare automatiquement avec l'identité vérifiée et vous indique le résultat.",
    checking: "Vérification en cours…",
    matched: "✓ Identité vérifiée — c'est bien le client attendu.",
    notMatched: "✗ La personne photographiée ne correspond pas au client vérifié.",
    notMatchedWhat:
      "Ne remettez pas les clés. Reprenez la photo en pleine lumière, visage dégagé. Si le résultat reste négatif, contactez CarKari : l'acompte sera remboursé au client.",
    unavailable:
      "Vérification automatique indisponible. Contrôlez la pièce d'identité physique du client.",
    checkFailed:
      "La vérification n'a pas abouti. Contrôlez la pièce d'identité physique du client.",
    retry: "Reprendre la photo",
    fallbackConfirm:
      "Je confirme avoir contrôlé la pièce d'identité physique du client et qu'elle correspond à la personne présente.",
    consent:
      "Informez le client : cette photo sert uniquement à confirmer son identité à la remise, elle est conservée comme preuve en cas de litige et supprimée 90 jours après la fin de la location.",
    notVerified:
      "Ce client n'a pas encore été vérifié par CarKari. Ne remettez pas le véhicule — demandez-lui de compléter la vérification d'identité dans son compte.",
    step2: "2. État du véhicule au départ",
    step2Hint:
      "5 photos, toujours les mêmes angles. Elles servent de référence à la restitution.",
    customerSlot: "Photo du client",
    customerSlotHint: "Visage bien visible, de face",
    cam: camFr,
    handover: handoverLabels.fr,
  },
  en: {
    step1: "1. Check the customer",
    step1Hint:
      "Photograph the customer in front of you. CarKari compares it automatically with their verified identity and tells you the result.",
    checking: "Checking…",
    matched: "✓ Identity verified — this is the expected customer.",
    notMatched: "✗ The person photographed does not match the verified customer.",
    notMatchedWhat:
      "Do not release the keys. Retake the photo in good light with the face clear. If it still fails, contact CarKari — the customer's deposit will be refunded.",
    unavailable:
      "Automatic check unavailable. Check the customer's physical ID document.",
    checkFailed:
      "The check did not complete. Check the customer's physical ID document.",
    retry: "Retake the photo",
    fallbackConfirm:
      "I confirm I checked the customer's physical ID and it matches the person present.",
    consent:
      "Tell the customer: this photo is used only to confirm their identity at handover, is kept as evidence in case of a dispute, and is deleted 90 days after the rental ends.",
    notVerified:
      "This customer has not been verified by CarKari yet. Do not release the vehicle — ask them to complete identity verification in their account.",
    step2: "2. Vehicle condition at pickup",
    step2Hint:
      "Five photos, always the same angles. They are the reference for the return.",
    customerSlot: "Customer photo",
    customerSlotHint: "Face clearly visible, straight on",
    cam: camEn,
    handover: handoverLabels.en,
  },
};
