import React, { useState } from 'react';
import ChatRoom from './ChatRoom';

const ChatWidget = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1050 }}>
            {isOpen ? (
                <div style={{ width: '300px', height: '400px', marginBottom: '10px' }}>
                    <ChatRoom
                        roomId="global-lobby"
                        user={user || { id: 'guest', name: 'Guest' }}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            ) : (
                <button
                    className="btn btn-primary rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px' }}
                    onClick={() => setIsOpen(true)}
                    title="Open Chat"
                >
                    <i className="bi bi-chat-dots-fill fs-4 text-white"></i>
                </button>
            )}
        </div>
    );
};

export default ChatWidget;
