import { ChevronsUpDown, Check, Building2, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import { useWorkspace } from "@/context/WorkspaceContext"

export default function WorkspaceSwitcher() {
    const { workspaces, selectedWorkspace, setSelectedWorkspaceId } = useWorkspace();
    const [open, setOpen] = useState(false)

    if (!selectedWorkspace) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between mb-4"
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedWorkspace.type === 'personal' ? <User className="h-4 w-4" /> :
                            selectedWorkspace.type === 'family' ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        <span className="truncate">{selectedWorkspace.name}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search workspace..." />
                    <CommandList>
                        <CommandEmpty>No workspace found.</CommandEmpty>
                        <CommandGroup>
                            {workspaces.map((framework) => (
                                <CommandItem
                                    key={framework.id}
                                    value={framework.name} // searching by name
                                    onSelect={() => {
                                        setSelectedWorkspaceId(framework.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedWorkspace.id === framework.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {framework.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
