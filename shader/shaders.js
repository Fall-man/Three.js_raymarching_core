export const vShader = `
void main() {
    gl_Position = vec4(position, 1.0); 
}
`;

export const fShader = `
precision mediump float;
precision mediump int;

#define PI 3.1415926535
#define TWO_PI PI*2.
#define HALF_PI PI*.5
#define EPS .0001

// Uniforms
uniform float time;
uniform vec2 resolution;
vec3 lightDir=normalize(vec3(0.,0.,.1));

// Fundamental operation functions
float dot2(vec2 v){
    return dot(v,v);
}

float dot3(vec3 v){
    return dot(v,v);
}

float ndot(vec2 a,vec2 b){
    return a.x*b.x-a.y*b.y;
}

// Replication operation
vec2 opRep2(vec2 p,vec2 c){
    return mod(p+.5*c,c)-.5*c;
}

vec3 opRep3(vec3 p,vec3 c){
    return mod(p+.5*c,c)-.5*c;
}

vec2 opRep2Lim(vec2 p,vec2 c){
    return p-c*clamp(round(p/c),-1.,1.);
}

vec3 opRep3Lim(vec3 p,vec3 c){
    return p-c*clamp(round(p/c),-1.,1.);
}

// Primitive combinations functions
float opUnion(float d1,float d2){
    return min(d1,d2);
}

float opSubtraction(float d1,float d2){
    return max(-d1,d2);
}

float opIntersection(float d1,float d2){
    return max(d1,d2);
}

float opSmoothUnion(float d1,float d2,float k){
    float h=clamp(.5+.5*(d2-d1)/k,.0,1.);
    return mix(d2,d1,h)-k*h*(1.-h);
}

float opSmoothSubtraction(float d1,float d2,float k){
    float h=clamp(.5-.5*(d2+d1)/k,.0,1.);
    return mix(d2,-d1,h)+k*h*(1.-h);
}

float opSmoothIntersection(float d1,float d2,float k){
    float h=clamp(.5-.5*(d2-d1)/k,.0,1.);
    return mix(d2,d1,h)+k*h*(1.-h);
}

// Positioning functions
vec3 opTranslation(vec3 p,mat3 t){
    return inverse(t)*p;
}

// Premitive distance functions
float sdSphere(vec3 p,float s){
    return length(p)-s;
}

float sdBox(vec3 p,vec3 b){
    vec3 q=abs(p)-b;
    return length(max(q,.0))+min(max(q.x,max(q.y,q.z)),.0);
}

float sdRoundBox(vec3 p,vec3 b,float r){
    vec3 q=abs(p)-b;
    return length(max(q,.0))+min(max(q.x,max(q.y,q.z)),.0)-r;
}

float sdPlane(vec3 p,vec3 n,float h){
    // n must be normalized
    return dot(p,n)+h;
}

float sdRoundCone(vec3 p,vec3 a,vec3 b,float r1,float r2){
    // sampling independent computations (only depend on shape)
    vec3 ba=b-a;
    float l2=dot(ba,ba);
    float rr=r1-r2;
    float a2=l2-rr*rr;
    float il2=1./l2;
    
    // sampling dependant computations
    vec3 pa=p-a;
    float y=dot(pa,ba);
    float z=y-l2;
    float x2=dot3(pa*l2-ba*y);
    float y2=y*y*l2;
    float z2=z*z*l2;
    
    // single square root!
    float k=sign(rr)*rr*rr*x2;
    if(sign(z)*a2*z2>k)return sqrt(x2+z2)*il2-r2;
    if(sign(y)*a2*y2<k)return sqrt(x2+y2)*il2-r1;
    return(sqrt(x2*a2*il2)+y*rr)*il2-r1;
}

float sceneDist(vec3 p){
    // return sdSphere(p, 1.);
    float roundBox1=sdRoundBox(vec3(opRep2(p.xy,vec2(50.,50.)),p.z),vec3(10.,10.,4.),1.);
    float sphere1=sdSphere(vec3(opRep2(p.xy,vec2(50.,50.)),p.z)-vec3(0.,0.,4.),4.);
    float sphere2=sdSphere(vec3(opRep2(p.xy,vec2(50.,50.)),p.z)-vec3(15.*sin(sin(TWO_PI*.4*time)),0.,25.-15.*cos(sin(TWO_PI*.4*time))),3.);
    return opUnion(sphere2,opSmoothSubtraction(sphere1,roundBox1,1.));
}

vec3 getNormal(vec3 p){
    return normalize(vec3(
            sceneDist(p+vec3(EPS,.0,.0))-sceneDist(p+vec3(-EPS,.0,.0)),
            sceneDist(p+vec3(.0,EPS,.0))-sceneDist(p+vec3(.0,-EPS,.0)),
            sceneDist(p+vec3(.0,.0,EPS))-sceneDist(p+vec3(.0,.0,-EPS))
        ));
    }
    
    float genShadow(vec3 ro,vec3 rd){
        float h=0.;
        float c=.001;
        float r=1.;
        float shadowCoef=.5;
        
        for(float t=0.;t<50.;t++){
            h=sceneDist(ro+rd*c);
            if(h<.001){
                return shadowCoef;
            }
            r=min(r,h*64./c);
            c+=h;
        }
        return 1.-shadowCoef+r*shadowCoef;
    }
    
    // Main function
    void main(){
        
        vec2 p=(gl_FragCoord.xy*2.-resolution)/min(resolution.x,resolution.y);
        
        vec3 cTarget=vec3(0.,0.,0.);
        // vec3 cPos = vec3(0.0, 20.0, 20.0);
        float rotationTime=mod(time,10.)/10.*TWO_PI;
        mat2 rotateMat=mat2(-sin(rotationTime),cos(rotationTime),cos(rotationTime),sin(rotationTime));
        vec3 cPos=vec3(rotateMat*vec2(20.,0.),12.)+cTarget;
        vec3 cDir=normalize(cTarget-cPos);
        vec3 cUp=normalize(cross(cDir,cross(cDir,cTarget+2.*vec3(0.,0.,cPos.z-cTarget.z))))*(-1.);
        vec3 cSide=cross(cDir,cUp);
        float targetDepth=1.;
        
        vec3 ray=normalize(cSide*p.x+cUp*p.y+cDir*targetDepth);
        
        float distance=.0;
        float rLen=.0;
        vec3 rPos=cPos;
        
        for(int i=0;i<128;i++){
            distance=sceneDist(rPos);
            if(distance<.001){break;}
            rLen+=distance;
            rPos=cPos+ray*rLen;
        }
        
        vec3 light=normalize(lightDir+vec3(0.,0.,0.));
        // vec3 light = normalize(lightDir + vec3(4 * sin(rotationTime * 2.0), 0.0, 0.0));
        
        vec3 color=vec3(.0);
        float shadow=1.;
        
        if(abs(distance)<.001){
            vec3 normal=getNormal(rPos);
            
            vec3 halfLE=normalize(light-ray);
            float diff=clamp(dot(light,normal),.1,1.);
            float spec=pow(clamp(dot(halfLE,normal),.0,1.),50.);
            
            shadow=genShadow(rPos+normal*.001,light);
            
            color=vec3(diff+spec);
        }
        
        color*=max(.5,shadow);
        
        gl_FragColor=vec4(color,1.);
    }
`;
