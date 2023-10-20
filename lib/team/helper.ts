import prisma from "@/lib/prisma";
import { TeamError } from "../errorHandler";

interface ITeamUserAndDocument {
  teamId: string;
  userId: string;
  docId?: string;
  checkOwner?: boolean; // will be deprecated in the future
  options?: {};
}

export async function getTeamWithUsersAndDocument({
  teamId,
  userId,
  docId,
  checkOwner,
  options,
}: ITeamUserAndDocument) {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      users: {
        select: {
          userId: true,
        },
      },
      documents: {
        ...options,
      },
    },
  });

  // check if the team exists
  if (!team) {
    throw new TeamError("Team doesn't exists");
  }

  // check if the user is part the team
  const teamHasUser = team?.users.some((user) => user.userId === userId);
  if (!teamHasUser) {
    throw new TeamError("You are not a member of the team");
  }

  // check if the document exists in the team
  let document: any;
  if (docId) {
    document = team?.documents.find((doc) => doc.id === docId);
    if (!document) {
      throw new TeamError("Document doesn't exists in the team");
    }
  }

  // Check that the user is owner of the document, otherwise return 401
  if (checkOwner) {
    const isUserOwnerOfDocument = document.ownerId === userId;
    if (!isUserOwnerOfDocument) {
      throw new TeamError("Unauthorized access to the document");
    }
  }

  return { team, document };
}
