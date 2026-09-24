export type Actor = ParentActor | ChildActor;

export interface ParentActor {
  familyRole: "PARENT";

  userId: string;
}

export interface ChildActor {
  familyRole: "CHILD";

  childProfileId: string;

  parentId: string;
}

export function isParent(actor: Actor): actor is ParentActor {
  return actor.familyRole === "PARENT";
}

export function isChild(actor: Actor): actor is ChildActor {
  return actor.familyRole === "CHILD";
}

export function owningParentId(actor: Actor): string {
  return actor.familyRole === "PARENT" ? actor.userId : actor.parentId;
}
