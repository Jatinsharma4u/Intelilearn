import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import  Button  from '../components/ui/Button';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');

  const friends = [
    { id: 1, name: 'Sarah Miller', avatar: '', status: 'online', score: 1850 },
    { id: 2, name: 'Mike Chen', avatar: '', status: 'offline', score: 1620 },
    { id: 3, name: 'Emma Wilson', avatar: '', status: 'online', score: 2100 }
  ];

  const requests = [
    { id: 1, name: 'David Kim', avatar: '', mutual: 3 },
    { id: 2, name: 'Lisa Taylor', avatar: '', mutual: 1 }
  ];

  return (
    <MainLayout>
      <div className="px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Friends</h1>
          <p className="text-[#b09ece]">
            Connect with friends and challenge them to battles
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="friends">My Friends</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="find">Find Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>Friends List</CardTitle>
                <CardDescription>
                  Your connected friends and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-4 bg-[#251f4f] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar src={friend.avatar} alt={friend.name} />
                        <div>
                          <div className="font-semibold text-white">{friend.name}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={friend.status === 'online' ? 'success' : 'secondary'}>
                              {friend.status}
                            </Badge>
                            <span className="text-[#b09ece]">{friend.score} XP</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm">Challenge</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
                <CardDescription>
                  Pending friend requests waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-[#251f4f] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar src={request.avatar} alt={request.name} />
                        <div>
                          <div className="font-semibold text-white">{request.name}</div>
                          <div className="text-sm text-[#b09ece]">
                            {request.mutual} mutual friends
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">Accept</Button>
                        <Button size="sm" variant="outline">Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="find">
            <Card>
              <CardHeader>
                <CardTitle>Find Friends</CardTitle>
                <CardDescription>
                  Search for new friends to connect with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full p-3 bg-[#251f4f] border border-[#4e4d6a] rounded-lg text-white placeholder-[#b09ece] focus:outline-none focus:ring-2 focus:ring-[#4829aa]"
                  />
                </div>
                <div className="text-center py-8 text-[#b09ece]">
                  <div className="text-4xl mb-4">👥</div>
                  <p>Search for friends to see results here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Friends;