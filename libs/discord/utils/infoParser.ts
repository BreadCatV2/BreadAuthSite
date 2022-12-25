export async function getBadge(num:number) {
    switch (num) {
        case 1:
            return "Staff";
        case 2:
            return "Partner";
        case 4:
            return "HypeSquad";
        case 8:
            return "Bug Hunter Level 1";
        case 64:
            return "House Bravery";
        case 128:
            return "House Brilliance";
        case 256:
            return "House Balance";
        case 512:
            return "Early Nitro Supporter";
        case 1024:
            return "Team User";
        case 16384:
            return "Bug Hunter Level 2";
        case 131072:
            return "Early Verified Bot Developer";
        case 262144:
            return "Discord Certified Moderator";
        case 4194304:
            return "Active Developer";
        default:
            return "None";
    }
}

export async function getNitro(num:number) {
    switch (num) {
        case 1:
            return "Nitro Classic";
        case 2:
            return "Nitro";
        case 3:
            return "Nitro Basic";
        default:
            return "None";
    }
}