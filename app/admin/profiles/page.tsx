import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EditProfileDialog } from '@/components/admin/edit-profile-dialog'

export default async function AdminProfilesPage() {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return <div className="p-8 text-red-500">Error loading profiles: {error.message}</div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Profiles</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles?.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell>
                                        <Avatar>
                                            <AvatarImage src={profile.avatar_url} />
                                            <AvatarFallback>
                                                {profile.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{profile.full_name || 'N/A'}</TableCell>
                                    <TableCell>{profile.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                                            {profile.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{profile.team || '-'}</TableCell>
                                    <TableCell>
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <EditProfileDialog profile={profile} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
