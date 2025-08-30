'use client';
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerDocs = () => {
    return <section className="container">
        <SwaggerUI url="/api/swagger.json" />
    </section>;
};

export default SwaggerDocs;
