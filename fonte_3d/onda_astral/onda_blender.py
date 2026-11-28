import bpy,math,random,sys
QUAL=sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene;random.seed(3)
sc.render.engine='CYCLES';sc.cycles.samples=24;sc.render.film_transparent=False
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(0,0,0,1)
sc.view_settings.view_transform='Standard'
R=256;sc.render.resolution_x=R;sc.render.resolution_y=R
bpy.ops.object.camera_add(location=(0,-10,0),rotation=(math.pi/2,0,0));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2;sc.camera=cam
def emis(nome,cor,forca,ruido=None,escala=4,velx=0,alfa_borda=False):
    m=bpy.data.materials.new(nome);m.use_nodes=True;nt=m.node_tree;nt.nodes.clear()
    out=nt.nodes.new('ShaderNodeOutputMaterial');em=nt.nodes.new('ShaderNodeEmission');em.inputs[0].default_value=cor
    if ruido:   # camada de energia: deixa passar o que está atrás e SOMA a sua luz (não esconde o núcleo)
        ad=nt.nodes.new('ShaderNodeAddShader');tr=nt.nodes.new('ShaderNodeBsdfTransparent')
        nt.links.new(tr.outputs[0],ad.inputs[0]);nt.links.new(em.outputs[0],ad.inputs[1]);nt.links.new(ad.outputs[0],out.inputs[0])
    else:nt.links.new(em.outputs[0],out.inputs[0])
    strength=em.inputs[1];strength.default_value=forca
    mul=None
    if ruido:
        tc=nt.nodes.new('ShaderNodeTexCoord');mp=nt.nodes.new('ShaderNodeMapping');nz=nt.nodes.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value=escala;nz.inputs['Detail'].default_value=6
        nt.links.new(tc.outputs['Object'],mp.inputs[0]);nt.links.new(mp.outputs[0],nz.inputs[0])
        if 'W' in nz.inputs:nz.noise_dimensions='4D';d=nz.inputs['W'].driver_add('default_value').driver;d.expression='frame/8'
        if velx:d2=mp.inputs['Location'].driver_add('default_value',0).driver;d2.expression=f'-frame*{velx}'
        cr=nt.nodes.new('ShaderNodeValToRGB');cr.color_ramp.elements[0].position=ruido[0];cr.color_ramp.elements[1].position=ruido[1]
        nt.links.new(nz.outputs['Fac'],cr.inputs[0])
        mul=nt.nodes.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=forca
        nt.links.new(cr.outputs[0],mul.inputs[0])
        if alfa_borda:
            lw=nt.nodes.new('ShaderNodeLayerWeight');lw.inputs[0].default_value=.35;inv=nt.nodes.new('ShaderNodeMath');inv.operation='SUBTRACT';inv.inputs[0].default_value=1
            nt.links.new(lw.outputs['Facing'],inv.inputs[1]);m2=nt.nodes.new('ShaderNodeMath');m2.operation='MULTIPLY'
            nt.links.new(mul.outputs[0],m2.inputs[0]);nt.links.new(inv.outputs[0],m2.inputs[1]);mul=m2
        nt.links.new(mul.outputs[0],strength)
    return m
CIANO=(.2,.75,1,1);BRANCO=(.85,.97,1,1);AZUL=(.05,.25,1,1)
def key(o,f,**kv):
    for k,v in kv.items():setattr(o,k,v);o.keyframe_insert(k,frame=f)
if QUAL=='feixe':
    # feixe horizontal longo: núcleo branco, camada ciano com ruído correndo, halo azul, espiral
    for raio,cor,forca,ruido,esc,nome in [(.09,BRANCO,5,None,0,'nucleo'),(.2,CIANO,1.6,(.25,.8),3,'meio'),(.34,AZUL,1.1,(.4,.9),2.2,'halo')]:
        bpy.ops.mesh.primitive_cylinder_add(radius=raio,depth=12,vertices=48,rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=nome
        o.data.materials.append(emis(nome,cor,forca,ruido,esc,velx=.35,alfa_borda=nome!='nucleo'))
    for k in range(2):   # duas espirais de energia girando
        t=bpy.data.curves.new('esp','CURVE');t.dimensions='3D';sp=t.splines.new('POLY');n=400;sp.points.add(n-1)
        for i in range(n):
            x=-6+12*i/n;a=x*5+k*math.pi;sp.points[i].co=(x,.3*math.cos(a),.3*math.sin(a),1)
        t.bevel_depth=.025;o=bpy.data.objects.new('esp',t);sc.collection.objects.link(o);o.data.materials.append(emis('esp',CIANO,1.3))
        o.driver_add('location',0).driver.expression=f'(frame*0.12)%{2*math.pi/5:.4f}'
    sc.render.resolution_x=R*3;cam.data.ortho_scale=6;sc.frame_start,sc.frame_end=1,24
elif QUAL=='carga':
    # esfera de energia que cresce (0-17) e pulsa (18-23), com anéis e faíscas sendo sugadas
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1,segments=48,ring_count=24);nuc=bpy.context.object;nuc.data.materials.append(emis('n',BRANCO,3.5))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1,segments=48,ring_count=24);cas=bpy.context.object;cas.data.materials.append(emis('c',CIANO,2.2,(.3,.85),3,alfa_borda=True))
    an=[]
    for k in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=1,minor_radius=.025,major_segments=64);t=bpy.context.object;t.rotation_euler=(random.uniform(0,3),random.uniform(0,3),0);t.data.materials.append(emis('t',CIANO,2.5));an.append(t)
        t.driver_add('rotation_euler',2).driver.expression=f'frame*{.25+.1*k}'
    fa=[]
    for k in range(14):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=.03,subdivisions=1);p=bpy.context.object;p.data.materials.append(emis('p',BRANCO,8));fa.append((p,random.uniform(0,6.28),random.uniform(-1,1),random.uniform(0,1)))
    for f in range(1,25):
        g=min(1,(f-1)/17);g=g*g*(3-2*g);pul=1+.06*math.sin(f*1.3)
        s=(.08+.62*g)*(pul if f>18 else 1)
        key(nuc,f,scale=(s*.55,)*3);key(cas,f,scale=(s,)*3)
        for t in an:key(t,f,scale=(s*1.25,)*3)
        for p,a,z,ph in fa:
            u=((f/12)+ph)%1;r=(1-u)*1.0+s*.6;key(p,f,location=(r*math.cos(a+u*2),0*z,r*math.sin(a+u*2)))
    cam.data.ortho_scale=2.1;sc.frame_start,sc.frame_end=1,24
else:
    # impacto: clarão, esfera que expande e some, anel de choque, raios (espinhos) e fagulhas
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1,segments=48,ring_count=24);esf=bpy.context.object;esf.data.materials.append(emis('e',CIANO,2.5,(.3,.85),3,alfa_borda=True))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1);nuc=bpy.context.object;nuc.data.materials.append(emis('n',BRANCO,4))
    bpy.ops.mesh.primitive_torus_add(major_radius=1,minor_radius=.05,major_segments=96,rotation=(math.pi/2,0,0));anel=bpy.context.object;anel.data.materials.append(emis('a',CIANO,3))
    am=anel.data.materials[0].node_tree.nodes['Emission'].inputs[1]
    esp=[]
    for k in range(12):
        a=k/12*6.28+random.uniform(-.2,.2);L=random.uniform(.6,1)
        bpy.ops.mesh.primitive_cone_add(radius1=.07,radius2=0,depth=1,vertices=8);c=bpy.context.object
        c.rotation_euler=(0,math.pi/2-a,0);c.data.materials.append(emis('s',BRANCO if k%2 else CIANO,7));esp.append((c,a,L))
    fag=[]
    for _ in range(20):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=.035,subdivisions=1);fag.append((bpy.context.object,random.uniform(0,6.28),random.uniform(.6,1.1)))
    for o,_,_ in fag:o.data.materials.append(emis('f',CIANO,8))
    for f in range(1,25):
        u=(f-1)/23
        key(nuc,f,scale=(max(.001,.35*(1-u/.35)),)*3 if u<.35 else (.001,)*3)
        e=.2+.45*min(1,u/.3);key(esf,f,scale=(e*(1 if u<.55 else max(.001,1-(u-.55)/.45)),)*3)
        r=.2+.7*min(1,u/.6);key(anel,f,scale=(r,r,1));am.default_value=3*max(0,1-u)**1.5;am.keyframe_insert('default_value',frame=f)
        for c,a,L in esp:
            s=max(.001,math.sin(min(1,u/.45)*math.pi))*L;d=.25+.45*min(1,u/.4)
            key(c,f,location=(d*math.cos(a),0,d*math.sin(a)),scale=(1,1,s))
        for o,a,v in fag:
            d=.2+v*min(1,u*1.6);key(o,f,location=(d*math.cos(a),0,d*math.sin(a)),scale=(max(.001,1-u),)*3)
    cam.data.ortho_scale=2.5;sc.frame_start,sc.frame_end=1,24
sc.render.filepath=f'/tmp/claude-0/onda/{QUAL}/q_';bpy.ops.render.render(animation=True)
